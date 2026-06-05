import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const categories = [
  {
    name: 'KEYBOARDS',
    slug: 'keyboard',
    img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'MICE',
    slug: 'mouse',
    img: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'HEADSETS',
    slug: 'headset',
    img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'MONITORS',
    slug: 'monitor',
    img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'PC COMPONENTS',
    slug: 'pc-components',
    img: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'GAMING CHAIRS',
    slug: 'chairs',
    img: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'STREAMING GEAR',
    slug: 'streaming',
    img: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'ACCESSORIES',
    slug: 'accessories',
    img: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=200&q=80',
  },
]

const ShopByCategory = () => (
  <section className="bg-[#0a0a0a] py-12 border-b border-white/5">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
          Shop By Category
        </h2>
        <Link
          to="/shop"
          className="flex items-center gap-2 text-[#ff4700] text-sm font-bold hover:text-[#e03e00] transition-colors"
        >
          View All Categories <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Link
              to={`/shop?category=${cat.slug}`}
              className="flex flex-col items-center justify-center group rounded-xl bg-[#0f0f0f] border border-white/5 hover:border-[#ff4700] hover:shadow-[0_0_15px_rgba(255,71,0,0.15)] transition-all duration-300 p-3"
            >
              <div className="w-full aspect-square flex items-center justify-center mb-3 overflow-hidden rounded-lg bg-[#1a1a1a]">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="font-bold text-gray-400 text-[10px] sm:text-[11px] tracking-wider uppercase text-center group-hover:text-white transition-colors leading-tight">
                {cat.name}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

export default ShopByCategory
