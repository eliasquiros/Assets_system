import styles from './Button.module.css'

export function Button({ variant = 'primary', className = '', children, ...rest }) {
  return (
    <button className={`${styles.button} ${styles[variant]} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}
