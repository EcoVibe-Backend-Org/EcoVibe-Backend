const PromoCode = require('../models/PromoCode');
const User = require('../models/user');
const Redemption = require('../models/Redemption');

// Get all promo codes
exports.getAllPromoCodes = async (req, res) => {
  try {
    const { active = 'true' } = req.query;
    
    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }
    
    const promoCodes = await PromoCode.find(query);
    
    res.status(200).json({
      success: true,
      count: promoCodes.length,
      promoCodes: promoCodes.map(code => ({
        id: code._id,
        name: code.name,
        icon: code.icon,
        points: code.points,
        description: code.description,
        expirationDays: code.expirationDays,
        locations: code.locations,
        staticCode: code.staticCode
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single promo code
exports.getPromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Promo code not found' });
    }
    
    res.status(200).json({
      success: true,
      promoCode: {
        id: promoCode._id,
        name: promoCode.name,
        icon: promoCode.icon,
        points: promoCode.points,
        description: promoCode.description,
        expirationDays: promoCode.expirationDays,
        locations: promoCode.locations,
        staticCode: promoCode.staticCode
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new promo code
exports.createPromoCode = async (req, res) => {
  try {
    const { name, icon, points, description, expirationDays, locations, staticCode } = req.body;
    
    // Generate a static code if not provided
    const generatedCode = staticCode || `${name.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const promoCode = new PromoCode({
      name,
      icon,
      points,
      description,
      expirationDays,
      locations,
      staticCode: generatedCode
    });
    
    await promoCode.save();
    
    res.status(201).json({
      success: true,
      promoCode: {
        id: promoCode._id,
        name: promoCode.name,
        icon: promoCode.icon,
        points: promoCode.points,
        description: promoCode.description,
        expirationDays: promoCode.expirationDays,
        locations: promoCode.locations,
        staticCode: promoCode.staticCode
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a promo code
exports.updatePromoCode = async (req, res) => {
  try {
    const { name, icon, points, description, expirationDays, locations, isActive } = req.body;
    
    const promoCode = await PromoCode.findById(req.params.id);
    
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Promo code not found' });
    }
    
    if (name) promoCode.name = name;
    if (icon) promoCode.icon = icon;
    if (points !== undefined) promoCode.points = points;
    if (description) promoCode.description = description;
    if (expirationDays) promoCode.expirationDays = expirationDays;
    if (locations) promoCode.locations = locations;
    if (isActive !== undefined) promoCode.isActive = isActive;
    
    await promoCode.save();
    
    res.status(200).json({
      success: true,
      promoCode: {
        id: promoCode._id,
        name: promoCode.name,
        icon: promoCode.icon,
        points: promoCode.points,
        description: promoCode.description,
        expirationDays: promoCode.expirationDays,
        locations: promoCode.locations,
        staticCode: promoCode.staticCode,
        isActive: promoCode.isActive
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a promo code
exports.deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Promo code not found' });
    }
    
    // Check if any redemptions exist for this promo code
    const redemptionsExist = await Redemption.exists({ promoCode: req.params.id });
    
    if (redemptionsExist) {
      // If redemptions exist, just mark as inactive
      promoCode.isActive = false;
      await promoCode.save();
      
      return res.status(200).json({
        success: true,
        message: 'Promo code deactivated as redemptions exist',
        deactivated: true
      });
    }
    
    // If no redemptions, completely remove
    await promoCode.remove();
    
    res.status(200).json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get promo codes available for a user
exports.getAvailablePromoCodes = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get all active promo codes
    const promoCodes = await PromoCode.find({ isActive: true });
    
    // Get already redeemed promo codes by this user
    const redeemedCodes = await Redemption.find({
      user: userId,
      status: { $in: ['ACTIVE', 'USED'] }
    }).distinct('promoCode');
    
    // Filter out redeemed codes and check if user has enough points
    const available = promoCodes
      .filter(code => !redeemedCodes.includes(code._id.toString()))
      .map(code => ({
        id: code._id,
        name: code.name,
        icon: code.icon,
        points: code.points,
        description: code.description,
        expirationDays: code.expirationDays,
        locations: code.locations,
        staticCode: code.staticCode,
        canRedeem: user.points >= code.points
      }));
    
    res.status(200).json({
      success: true,
      userPoints: user.points,
      promoCodes: available
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
