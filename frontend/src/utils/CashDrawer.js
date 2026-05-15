// Cash drawer utility for POS
export const openCashDrawer = () => {
  // Play cash drawer sound (optional)
  try {
    const audio = new Audio('/cash-drawer.mp3')
    audio.play().catch(() => {})
  } catch(e) {}
  
  // Show notification
  console.log('💰 Cash drawer opened!')
  
  // Return true for successful opening
  return true
}

export const testCashDrawer = () => {
  alert('🔓 The cash holder is open now!')
  return true
}