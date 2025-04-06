import { model, Schema } from "mongoose";

const geoStatSchema = new Schema({
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  country: { type: String, required: true },
  city: { type: String, default: "Unknown" },
  count: { type: Number, default: 0 },
  countAddToCart: { type: Number, default: 0 },
});

const GeoStat = model("GeoStat", geoStatSchema, "geo_stat");
export default GeoStat;
