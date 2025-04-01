import { Client, LogLevel, OrdersController, } from "@paypal/paypal-server-sdk";
import { getSettings } from "../settings/settings.controller.js";
let ordersController = null;
const getOrdersController = async () => {
    if (ordersController)
        return ordersController; // Nếu đã có instance thì dùng lại
    const settings = await getSettings();
    if (!settings?.paypalClientId || !settings?.paypalSecret) {
        return null;
    }
    const client = new Client({
        clientCredentialsAuthCredentials: {
            oAuthClientId: settings.paypalClientId,
            oAuthClientSecret: settings.paypalSecret,
        },
        timeout: 0,
        environment: settings.paypalMode,
        logging: {
            logLevel: LogLevel.Info,
            logRequest: { logBody: true },
            logResponse: { logHeaders: true },
        },
    });
    ordersController = new OrdersController(client);
    return ordersController;
};
export default getOrdersController;
//# sourceMappingURL=payment-order.controller.js.map