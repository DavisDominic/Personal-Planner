import { BrowserRouter, Link, Route, Routes } from 'react-router'
import Gallery from './gallery/Gallery'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Link to="/gallery">Component gallery</Link>} />
        <Route path="/gallery" element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  )
}
