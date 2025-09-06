import { motion } from 'framer-motion'

export default function Recipe() {
  return (
    <div className="section-card bg-white border-2 border-green-500 rounded-3xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">🥨</div>
        <h2 className="text-3xl font-bold text-green-600">
          Chex Mix Recipe
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="badge bg-green-500 text-white border-none font-semibold px-4 py-2 rounded-full shadow-md">
            📝 Ingredients
          </div>
          <ul className="space-y-3 bg-green-50 rounded-2xl p-6 border-2 border-green-500">
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">•</span>
              <span className="text-gray-700">9 cups assorted Chex cereals</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">•</span>
              <span className="text-gray-700">2 cups pretzels</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">•</span>
              <span className="text-gray-700">1 cup nuts (optional)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">•</span>
              <span className="text-gray-700">6 tbsp butter, melted</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">•</span>
              <span className="text-gray-700">2 tbsp Worcestershire sauce</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">•</span>
              <span className="text-gray-700">1½ tsp seasoned salt</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">•</span>
              <span className="text-gray-700">¾ tsp garlic powder, ½ tsp onion powder</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4"
        >
          <div className="badge bg-green-400 text-white border-none font-semibold px-4 py-2 rounded-full shadow-md">
            👩‍🍳 Directions
          </div>
          <ol className="space-y-4 bg-green-50 rounded-2xl p-6 border-2 border-green-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-400 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-gray-700">Heat oven to 250°F (120°C).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-400 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span className="text-gray-700">Combine cereals, pretzels, and nuts in a large roasting pan.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-400 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-gray-700">Stir butter, Worcestershire, and seasonings; drizzle and toss to coat.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-400 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span className="text-gray-700">Bake, stirring every 15 minutes, for 1 hour or until crisp.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-400 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <span className="text-gray-700">Cool completely before storing. Enjoy!</span>
            </li>
          </ol>
        </motion.div>
      </div>

      <div className="divider my-8" />

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border-2 border-green-500 bg-green-50 shadow-sm">
          <div className="font-bold text-lg mb-2 inline-flex items-center gap-2 text-green-600">
            <span className="text-xl">🍽️</span> Serving
          </div>
          <div className="text-gray-700">Makes about 12 servings.</div>
        </div>
        <div className="glass rounded-2xl p-6 border-2 border-green-400 bg-green-50 shadow-sm">
          <div className="font-bold text-lg mb-2 inline-flex items-center gap-2 text-green-600">
            <span className="text-xl">📋</span> Rounds
          </div>
          <div className="text-gray-700">Typical: 4 rounds at 15 minutes.</div>
        </div>
      </div>
    </div>
  )
}

