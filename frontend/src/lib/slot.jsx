import React from 'react'

export const Slot = React.forwardRef(({ children, ...props }, ref) => {
  const child = React.Children.only(children)
  
  return React.cloneElement(child, {
    ...props,
    ref,
    className: [props.className, child.props.className].filter(Boolean).join(' '),
  })
})

Slot.displayName = 'Slot'
