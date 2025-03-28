import { Request, Response } from "express";
import axios from "axios";
import config from "../../config/index.js";
const { paypalClientId, paypalClientSecret, paypalApi } = config;
async function getAccessToken() {
  try {
    const response = await axios.post(
      `${paypalApi}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        auth: {
          username: paypalClientId,
          password: paypalClientSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    return null;
  }
}
async function generateClientToken(_req: Request, res: Response) {
  try {
    // 1️⃣ Lấy access token từ PayPal

    const accessToken = await getAccessToken();
    if (!accessToken) {
      res.status(500).json({ error: "Error generating access token" });
      return;
    }

    // 2️⃣ Lấy client token
    const tokenResponse = await axios({
      url: `${paypalApi}/v1/identity/generate-token`,
      method: "post",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: {},
    });

    res.json({ clientToken: tokenResponse.data.client_token });
  } catch (error) {
    console.error("Error generating client token:", error);
    res.status(500).json({ error: "Error generating client token" });
    return;
  }
}
export async function createOrder(req: Request, res: Response) {
  try {
    console.log("Create order");

    const accessToken = await getAccessToken();
    const { paypalApi } = config;
    const { amount, currency, billingAddress } = req.body;

    const order = await axios.post(
      `${paypalApi}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency || "USD",
              value: amount || "10.00",
            },
            billing_address: {
              address_line_1: billingAddress?.address_line_1,
              address_line_2: billingAddress?.address_line_2 || "",
              admin_area_2: billingAddress?.city,
              admin_area_1: billingAddress?.state,
              postal_code: billingAddress?.postal_code,
              country_code: billingAddress?.country_code || "US",
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(order.data);
  } catch (error) {
    res.status(500).json({ error: "Error creating order" });
  }
}

export async function captureOrder(req: Request, res: Response) {
  console.log("Capture order");

  try {
    const { orderID } = req.body;
    const accessToken = await getAccessToken();
    const { paypalApi } = config;

    const capture = await axios.post(
      `${paypalApi}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(capture.data);
  } catch (error) {
    res.status(500).json({ error: "Error capturing order" });
  }
}

export default { createOrder, captureOrder, generateClientToken };
