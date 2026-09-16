import { BrowserRouter } from 'react-router-dom'
import { BuildingSizingPage, SizingCustomerDetailsPage, SizingProjectTypePage } from '../features/sizing'
import { DjuaApp } from './legacy/DjuaApp'

/**
 * Application composition root. Providers and application-wide boundaries
 * belong here; feature routes remain in the implementation being migrated.
 */
export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <DjuaApp newSizingEntry={<SizingProjectTypePage />} buildingSizingEntry={<BuildingSizingPage />} customerDetailsEntry={<SizingCustomerDetailsPage />} />
    </BrowserRouter>
  )
}
