const mongoose = require('mongoose');

const SalesGoalSchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  manager: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  goalName: { 
    type: String, 
    required: true 
  },
  goalAmount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: { 
    type: Date 
  },
  // Novo campo para status da meta
  status: {
    type: String,
    enum: ['em_andamento', 'alcancada', 'finalizada'],
    default: 'em_andamento'
  }
}, { timestamps: true });

// Middleware ou método para validar se endDate é posterior a startDate
SalesGoalSchema.pre('save', function(next) {
  if (this.endDate && this.endDate <= this.startDate) {
    return next(new Error('endDate deve ser posterior a startDate'));
  }
  next();
});

module.exports = mongoose.model('SalesGoal', SalesGoalSchema);
