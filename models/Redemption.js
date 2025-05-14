const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RedemptionSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  promoCode: { 
    type: Schema.Types.ObjectId, 
    ref: 'PromoCode', 
    required: true 
  },
  redeemedAt: { 
    type: Date, 
    default: Date.now 
  },
  expirationDate: { 
    type: Date,
    required: true
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'USED', 'EXPIRED', 'REVOKED'],
    default: 'ACTIVE'
  },
  usedAt: Date,
  usedLocation: String,
  code: {
    type: String,
    required: true
  },
  promoDetails: {
    name: String,
    description: String,
    icon: String,
    pointsCost: Number,
    locations: [String],
    staticCode: String
  }
});

// Indexes for performance
RedemptionSchema.index({ user: 1, status: 1 });
RedemptionSchema.index({ promoCode: 1 });
RedemptionSchema.index({ expirationDate: 1 });

// Virtual property to check if redemption is expired
RedemptionSchema.virtual('isExpired').get(function() {
  return this.status === 'EXPIRED' || new Date() > this.expirationDate;
});

// Pre-save middleware to automatically expire redemptions
RedemptionSchema.pre('save', function(next) {
  if (this.status === 'ACTIVE' && new Date() > this.expirationDate) {
    this.status = 'EXPIRED';
  }
  next();
});

module.exports = mongoose.model('Redemption', RedemptionSchema);
