const Redemption = require('../models/Redemption');
const PromoCode = require('../models/PromoCode');
const User = require('../models/user');
const mongoose = require('mongoose');

// Redeem a promo code
exports.redeemPromoCode = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { userId, promoCodeId } = req.body;
    
    const user = await User.findById(userId).session(session);
    const promoCode = await PromoCode.findById(promoCodeId).session(session);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!promoCode) {
      throw new Error('Promo code not found');
    }
    
    if (!promoCode.isActive) {
      throw new Error('This promo code is not active');
    }
    
    // Check if user has enough points
    if (user.points < promoCode.points) {
      throw new Error(`Not enough points. You need ${promoCode.points} points but have ${user.points}`);
    }
    
    // Check if already redeemed
    const existingRedemption = await Redemption.findOne({
      user: userId,
      promoCode: promoCodeId,
      status: { $in: ['ACTIVE', 'USED'] }
    }).session(session);
    
    if (existingRedemption) {
      throw new Error('You have already redeemed this promo code');
    }
    
    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + promoCode.expirationDays);
    
    // Create unique code for this redemption
    const uniqueCode = `${promoCode.staticCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Create redemption
    const redemption = new Redemption({
      user: userId,
      promoCode: promoCodeId,
      expirationDate,
      code: uniqueCode,
      promoDetails: {
        name: promoCode.name,
        description: promoCode.description,
        icon: promoCode.icon,
        pointsCost: promoCode.points,
        locations: promoCode.locations,
        staticCode: promoCode.staticCode
      }
    });
    
    await redemption.save({ session });
    
    // Deduct points from user
    user.points -= promoCode.points;
    await user.save({ session });
    
    await session.commitTransaction();
    
    res.status(200).json({
      success: true,
      message: 'Promo code redeemed successfully',
      redemption: {
        id: redemption._id,
        code: redemption.code,
        name: promoCode.name,
        description: promoCode.description,
        expirationDate: redemption.expirationDate,
        locations: promoCode.locations
      },
      remainingPoints: user.points
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// Get user's redemptions
exports.getUserRedemptions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = 'ACTIVE' } = req.query;
    
    let query = { user: userId };
    
    if (status !== 'ALL') {
      query.status = status;
    }
    
    const redemptions = await Redemption.find(query).sort({ redeemedAt: -1 });
    
    // Check for expired redemptions and update them
    const now = new Date();
    const formattedRedemptions = [];
    
    for (const redemption of redemptions) {
      if (redemption.status === 'ACTIVE' && now > redemption.expirationDate) {
        redemption.status = 'EXPIRED';
        await redemption.save();
      }
      
      formattedRedemptions.push({
        id: redemption._id,
        code: redemption.code,
        name: redemption.promoDetails.name,
        description: redemption.promoDetails.description,
        icon: redemption.promoDetails.icon,
        expirationDate: redemption.expirationDate,
        status: redemption.status,
        locations: redemption.promoDetails.locations,
        redeemedAt: redemption.redeemedAt
      });
    }
    
    res.status(200).json({
      success: true,
      redemptions: formattedRedemptions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark a redemption as used
exports.markRedemptionAsUsed = async (req, res) => {
  try {
    const { redemptionId } = req.params;
    const { location } = req.body;
    
    const redemption = await Redemption.findById(redemptionId);
    
    if (!redemption) {
      return res.status(404).json({ success: false, message: 'Redemption not found' });
    }
    
    if (redemption.status !== 'ACTIVE') {
      return res.status(400).json({ 
        success: false, 
        message: `This code is already ${redemption.status.toLowerCase()}`
      });
    }
    
    if (new Date() > redemption.expirationDate) {
      redemption.status = 'EXPIRED';
      await redemption.save();
      return res.status(400).json({ success: false, message: 'This code has expired' });
    }
    
    redemption.status = 'USED';
    redemption.usedAt = new Date();
    redemption.usedLocation = location;
    await redemption.save();
    
    res.status(200).json({
      success: true,
      message: 'Code marked as used',
      redemption: {
        id: redemption._id,
        code: redemption.code,
        name: redemption.promoDetails.name,
        usedAt: redemption.usedAt,
        usedLocation: redemption.usedLocation
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
