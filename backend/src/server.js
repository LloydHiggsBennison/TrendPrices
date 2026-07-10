const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` PriceTrend Backend Server running on port ${PORT}`);
  console.log(` API base path: http://localhost:${PORT}/api`);
  console.log(` Supabase connected to: ${process.env.SUPABASE_URL || 'Placeholder'}`);
  console.log(`==================================================`);
});
