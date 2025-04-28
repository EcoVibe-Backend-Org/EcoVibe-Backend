// middleware/pinMiddleware.js

// Valid pin types for your app
const VALID_TYPES = ["Recycling Bin", "Recycling Vendor", "Community Drop-off"];

// Validate Pin Data
exports.validatePinData = (data) => {
  const { name, location, type, description, acceptedMaterials, icon } = data;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return { error: "Please add a name" };
  }

  if (
    !location ||
    !Array.isArray(location) ||
    location.length !== 2 ||
    typeof location[0] !== "number" ||
    typeof location[1] !== "number"
  ) {
    return { error: "Please add a valid location (array: [lng, lat])" };
  }

  if (!type || !VALID_TYPES.includes(type)) {
    return { error: `Type must be one of: ${VALID_TYPES.join(", ")}` };
  }

  // description is optional, but if present must be a string (optional)
  if (description && typeof description !== "string") {
    return { error: "Description must be a string" };
  }

  // acceptedMaterials is optional but if present must be an array of strings
  if (
    acceptedMaterials &&
    (!Array.isArray(acceptedMaterials) ||
      !acceptedMaterials.every((mat) => typeof mat === "string"))
  ) {
    return { error: "Accepted materials must be an array of strings" };
  }

  // icon is optional, but if present must be a string (optional)
  if (icon && typeof icon !== "string") {
    return { error: "Icon must be a string" };
  }

  return {}; // Valid
};
