import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Flame, Crown } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useToast } from './Toast'

const bundles = [
  {
    name: 'Pro Performance Bundle',
    tag: 'BEST VALUE',
    tagIcon: Zap,
    desc: 'Everything you need to dominate every session.',
    price: 64999,
    oldPrice: 89999,
    save: 25000,
    accent: '#ff4700',
    glow: 'rgba(255,71,0,0.15)',
    image: '/bundle1.png',
  },
  {
    name: 'Streaming Elite Bundle',
    tag: 'MOST POPULAR',
    tagIcon: Flame,
    desc: 'Game. Stream. Create. All in one setup.',
    price: 159999,
    oldPrice: 199999,
    save: 40000,
    accent: '#ff4700',
    glow: 'rgba(255,71,0,0.2)',
    featured: true,
    image: '/bundle2.png',
  },
  {
    name: 'Ultimate PC Power Bundle',
    tag: 'TOP TIER',
    tagIcon: Crown,
    desc: 'Maximum performance. Zero compromises.',
    price: 249999,
    oldPrice: 299999,
    save: 50000,
    accent: '#ff4700',
    glow: 'rgba(255,71,0,0.15)',
    image: '/bundle3.png',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

const BuildYourSetup = () => {
  const { addToCart } = useCart()
  const { addToast } = useToast()

  const handleAddToCart = (e, bundle) => {
    e.preventDefault()
    addToCart({ _id: bundle.name, name: bundle.name, price: bundle.price, image: bundle.image })
    addToast(`${bundle.name} added to cart!`, 'success')
  }

  return (
    <section className="relative bg-[#0a0a0a] py-20 border-b border-white/5 overflow-hidden">

      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff4700]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff4700]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-[#ff4700] text-xs font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2"
              >
                <span className="inline-block w-6 h-px bg-[#ff4700]" />
                Curated Bundles
              </motion.p>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
                BUILD YOUR
                <span className="block text-[#ff4700]">ULTIMATE SETUP</span>
              </h2>
              <p className="text-gray-500 text-sm mt-3 max-w-sm leading-relaxed">
                Hand-picked gear combos — save big and level up your entire battlestation.
              </p>
            </div>
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 text-gray-400 hover:text-[#ff4700] text-sm font-bold transition-colors self-start sm:self-auto"
            >
              View All Bundles
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* ── Cards ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {bundles.map((bundle) => {
            const TagIcon = bundle.tagIcon
            return (
              <motion.div
                key={bundle.name}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={`group relative bg-[#0f0f0f] border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 cursor-pointer
                  ${bundle.featured
                    ? 'border-[#ff4700]/60 shadow-[0_0_40px_rgba(255,71,0,0.15)]'
                    : 'border-white/5 hover:border-[#ff4700]/50 hover:shadow-[0_0_30px_rgba(255,71,0,0.1)]'
                  }`}
              >
                {/* Featured glow overlay */}
                {bundle.featured && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff4700]/5 via-transparent to-transparent pointer-events-none" />
                )}

                {/* Top accent bar */}
                <div className={`h-0.5 w-full bg-gradient-to-r from-transparent via-[#ff4700] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${bundle.featured ? 'opacity-100' : ''}`} />

                {/* Image area */}
                <div className="relative h-52 bg-[#0d0d0d] flex items-center justify-center overflow-hidden px-6 pt-6">
                  {/* Tag badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#ff4700] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider z-10">
                    <TagIcon className="w-3 h-3" />
                    {bundle.tag}
                  </div>

                  {/* Save badge */}
                  <div className="absolute top-4 right-4 bg-[#0f0f0f] border border-[#ff4700]/30 text-[#ff4700] text-[10px] font-black px-2 py-0.5 rounded uppercase z-10">
                    SAVE Rs.{bundle.save.toLocaleString()}
                  </div>

                  <img
                    src={bundle.image}
                    alt={bundle.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_24px_rgba(255,71,0,0.3)]"
                  />
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-white font-black text-lg leading-tight mb-1.5 group-hover:text-[#ff4700] transition-colors duration-300">
                    {bundle.name}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-5">{bundle.desc}</p>

                  {/* Divider */}
                  <div className="h-px bg-white/5 mb-5" />

                  {/* Price row */}
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-white font-black text-2xl">Rs.{bundle.price.toLocaleString()}</span>
                        <span className="text-gray-600 text-xs line-through">Rs.{bundle.oldPrice.toLocaleString()}</span>
                      </div>
                      <p className="text-[#ff4700] text-[11px] font-bold mt-0.5">You save Rs.{bundle.save.toLocaleString()}</p>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(e, bundle)}
                      className="flex items-center gap-1.5 bg-transparent border border-white/10 hover:bg-[#ff4700] hover:border-[#ff4700] text-gray-400 hover:text-white text-[11px] font-black px-4 py-2.5 rounded-lg transition-all duration-200 uppercase tracking-wide"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

      </div>
    </section>
  )
}

export default BuildYourSetup
