'use client'

import React from 'react'
import { useExampleHook } from '@/hooks/useExampleHook'
import { ExampleProps } from '@/types'
import { SomeUIComponent } from '@/components/ui/some-ui-component'

export function ExampleComponent({ prop1, prop2 }: ExampleProps) {
  const { someState, someFunction } = useExampleHook()

  return (
    <div>
      <SomeUIComponent />
      {/* Component logic */}
    </div>
  )
}