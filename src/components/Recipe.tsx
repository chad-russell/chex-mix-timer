import { motion } from 'framer-motion'
import { Cookie, ListChecks, Utensils, Sprout } from 'lucide-react'

export default function Recipe() {
  return (
    <div className="section-card">
      <div className="flex items-center gap-2 mb-4">
        <Cookie className="text-primary" />
        <h2 className="text-2xl font-semibold">Chex Mix — Placeholder Recipe</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="badge badge-outline">Ingredients</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>9 cups assorted Chex cereals</li>
            <li>2 cups pretzels</li>
            <li>1 cup nuts (optional)</li>
            <li>6 tbsp butter, melted</li>
            <li>2 tbsp Worcestershire sauce</li>
            <li>1½ tsp seasoned salt</li>
            <li>¾ tsp garlic powder, ½ tsp onion powder</li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-3">
          <div className="badge badge-outline">Directions</div>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Heat oven to 250°F (120°C).</li>
            <li>Combine cereals, pretzels, and nuts in a large roasting pan.</li>
            <li>Stir butter, Worcestershire, and seasonings; drizzle and toss to coat.</li>
            <li>Bake, stirring every 15 minutes, for 1 hour or until crisp.</li>
            <li>Cool completely before storing. Enjoy!</li>
          </ol>
        </motion.div>
      </div>

      <div className="divider" />

      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <div className="glass rounded-xl p-4">
          <div className="font-medium inline-flex items-center gap-2"><Utensils className="text-accent" /> Serving</div>
          Makes about 12 servings.
        </div>
        <div className="glass rounded-xl p-4">
          <div className="font-medium inline-flex items-center gap-2"><ListChecks className="text-accent" /> Rounds</div>
          Typical: 4 rounds at 15 minutes.
        </div>
        <div className="glass rounded-xl p-4">
          <div className="font-medium inline-flex items-center gap-2"><Sprout className="text-accent" /> Notes</div>
          Adjust salt to taste; add festive mix-ins once cooled.
        </div>
      </div>

      <p className="opacity-70 text-xs mt-4">These are placeholders. We can update to your exact family recipe later.</p>
    </div>
  )
}

