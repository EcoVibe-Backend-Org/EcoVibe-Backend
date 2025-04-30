// middleware/pinMiddleware.js

// Valid pin types for your app
const VALID_TYPES = ["Recycling Bin", "Recycling Vendor", "Community Drop-off"];

// Validate Pin Data
exports.validatePinData = (data) => {
  const { name, location, type, description, acceptedMaterials, icon } = data;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return { error: "Please add a name" };
  }

  // FIXED location check 👇
  if (
    !location ||
    typeof location !== "object" ||
    location.type !== "Point" ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2 ||
    typeof location.coordinates[0] !== "number" ||
    typeof location.coordinates[1] !== "number"
  ) {
    return { error: "Please add a valid location (GeoJSON: {type: 'Point', coordinates: [lng, lat]})" };
  }

  if (!type || !VALID_TYPES.includes(type)) {
    return { error: `Type must be one of: ${VALID_TYPES.join(", ")}` };
  }

  if (description && typeof description !== "string") {
    return { error: "Description must be a string" };
  }

  if (
    acceptedMaterials &&
    (!Array.isArray(acceptedMaterials) ||
      !acceptedMaterials.every((mat) => typeof mat === "string"))
  ) {
    return { error: "Accepted materials must be an array of strings" };
  }

  if (icon && typeof icon !== "string") {
    return { error: "Icon must be a string" };
  }

  return {}; // Valid
};