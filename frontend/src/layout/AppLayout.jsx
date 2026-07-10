import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AppNav } from './AppNav'
import { Toast } from '../components/Toast'
import { useBadges } from './useBadges'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const badges = useBadges()
  return (
    <div>
      <AppHeader />
      <AppNav badges={badges} />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Toast />
    </div>
  )
}
