// middleware/pinMiddleware.js

// Validate Pin Data
exports.validatePinData = (data) => {
  const { name, location, icon } = data;

  if (!name) {
    return { error: "Please add a name" };
  }

  if (!location || !Array.isArray(location) || location.length !== 2) {
    return { error: "Please add a valid location" };
  }

  if (!icon) {
    return { error: "Please add an icon" };
  }

  return {}; // Return an empty object if validation passes
};
