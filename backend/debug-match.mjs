import fs from 'fs'
import path from 'path'
const productPicturesDir = path.join(process.cwd(), '../../product pictures')
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']
const normalizeText = (text = '') => text.toLowerCase().normalize('NFKD').replace(/[-]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const pictureFiles = fs.existsSync(productPicturesDir)
  ? fs.readdirSync(productPicturesDir).filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
  : []
const products = [
  'Coca Cola 500ml','Pepsi 500ml','Sprite 500ml','Royal 500ml','Mountain Dew','Sting Strawberry','Nescafe Stick','Great Taste','Kopiko Black','C2 Green Tea','Minute Maid','Mineral Water 500ml','Lays Classic','Lays Sour Cream','Tortillos Cheese','Nova Cheddar','Piattos BBQ','Oreo Cookies','Bear Brand Milk','Alaska Evap','Nestle Cream','Selecta Milk','Knorr Noodles','Payless Noodles','Lucky Me Pancit','Rice 1kg','Canned Tuna','Eggs 1 dozen','Bread Loaf','Shampoo 200ml','Toothpaste 100ml','Soap Bar','Detergent Powder','Dish Soap'
]
const normalize = normalizeText
const matchCandidates = pictureFiles.map(file => ({ file, key: normalize(path.parse(file).name) }))
console.log('pictureFiles', pictureFiles)
for (const product of products) {
  const normalizedProduct = normalize(product)
  let best = null
  let bestScore = -1
  for (const { file, key } of matchCandidates) {
    const productWords = new Set(normalizedProduct.split(' '))
    const keyWords = new Set(key.split(' '))
    const intersection = [...keyWords].filter(w => productWords.has(w)).length
    let score = intersection * 10
    if (key === normalizedProduct) score += 100
    if (normalizedProduct.includes(key) || key.includes(normalizedProduct)) score += 20
    const lev = (a, b) => {
      const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
      for (let i = 0; i <= a.length; i++) dp[i][0] = i
      for (let j = 0; j <= b.length; j++) dp[0][j] = j
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1))
        }
      }
      return dp[a.length][b.length]
    }
    const maxlen = Math.max(normalizedProduct.length, key.length)
    const similarity = maxlen === 0 ? 0 : 1 - lev(normalizedProduct, key) / maxlen
    if (similarity > 0.5) score += similarity * 30
    if (score > bestScore) {
      bestScore = score
      best = { file, key, score, similarity }
    }
  }
  console.log(product, '->', best)
}
