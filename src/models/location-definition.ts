export const locationDefinition = {
  label: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  geo: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  address: {
    line: { type: String, trim: true, maxlength: 300 },
    village: { type: String, trim: true, maxlength: 120 },
    district: { type: String, trim: true, maxlength: 120 },
    state: { type: String, trim: true, maxlength: 120 },
    pincode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, trim: true, maxlength: 2 },
  },
};
