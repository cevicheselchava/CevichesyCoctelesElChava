const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

function poundsFromOrder(order) {
  if (Number(order?.pounds) > 0) return Number(order.pounds);
  return (order?.items || []).reduce((sum, item) => sum + Number(item?.qty || 0), 0);
}

exports.notifyNewOnlineOrder = onDocumentCreated(
  {
    document: 'pedidos/{orderId}',
    region: 'us-central1',
    retry: false,
    maxInstances: 2
  },
  async (event) => {
    const order = event.data?.data();
    if (!order) return;

    // Solo los pedidos hechos por el cliente en la app.
    // Los registros capturados manualmente también usan source=app-clientes,
    // por eso manualOrder los excluye de esta notificación.
    if (order.source !== 'app-clientes' || order.manualOrder === true) return;

    const db = getFirestore();
    const tokenSnap = await db.collection('adminPushTokens').where('enabled', '==', true).get();
    const docs = tokenSnap.docs.filter((doc) => typeof doc.data()?.token === 'string' && doc.data().token.trim());
    if (!docs.length) {
      console.log('No hay teléfonos registrados para notificaciones.');
      return;
    }

    const pounds = poundsFromOrder(order);
    const customer = String(order.customer || 'Cliente').trim();
    const when = [order.deliveryDate, order.time].filter(Boolean).join(' · ');
    const bodyParts = [customer, pounds > 0 ? `${pounds} lb` : '', when].filter(Boolean);
    const body = bodyParts.length
      ? `${bodyParts.join(' · ')}. Revisa Pedidos > En línea.`
      : 'Revisa Pedidos > En línea.';

    const message = {
      tokens: docs.map((doc) => doc.data().token),
      notification: {
        title: '🔔 Nuevo pedido en línea',
        body
      },
      data: {
        orderId: String(event.params.orderId || ''),
        section: 'online-orders'
      },
      webpush: {
        fcmOptions: {
          link: 'https://ceviches-y-cocteles-el-chava.web.app/admin/'
        }
      }
    };

    const response = await getMessaging().sendEachForMulticast(message);
    const invalidDocs = [];

    response.responses.forEach((result, index) => {
      if (result.success) return;
      const code = result.error?.code || '';
      console.error('FCM error:', code, result.error?.message || '');
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidDocs.push(docs[index].ref);
      }
    });

    if (invalidDocs.length) {
      const batch = db.batch();
      invalidDocs.forEach((ref) => batch.update(ref, { enabled: false }));
      await batch.commit();
    }

    console.log(`Notificación enviada: ${response.successCount} ok, ${response.failureCount} error(es).`);
  }
);
