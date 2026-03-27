import axios from "axios";
import { normalizeOpenSkyState } from "./Normalizer";
import { Entity } from "../../../../shared/contract";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" });

export async function fetchOpenSkyStates(): Promise<Entity[]> {
  const password = process.env.OPENSKY_PASSWORD || process.env.OPENSKY_CLIENT_SECRET || "";
  const credentials = Buffer.from(`vidbsocial@gmail.com:${password}`).toString("base64");
  
  const response = await axios.get("https://api.opensky-network.org/states/all", {
    headers: {
      Authorization: `Basic ${credentials}`
    }
  });

  if (!response.data || !response.data.states) {
    return [];
  }

  return response.data.states.map(normalizeOpenSkyState);
}
