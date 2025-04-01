import {
  Client,
  Environment,
  LogLevel,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { getSettings } from "../settings/settings.controller.js";

let ordersController: OrdersController | null = null;

const getOrdersController = async (): Promise<OrdersController | null> => {
  if (ordersController) return ordersController; // Nếu đã có instance thì dùng lại

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
    environment: settings.paypalMode as Environment,
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
