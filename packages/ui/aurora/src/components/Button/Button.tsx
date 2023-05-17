//
// Copyright 2022 DXOS.org
//

import { createContext } from '@radix-ui/react-context';
import { Primitive } from '@radix-ui/react-primitive';
import { Slot } from '@radix-ui/react-slot';
import React, { ComponentPropsWithoutRef, ComponentPropsWithRef, forwardRef } from 'react';

import { Density, Elevation } from '@dxos/aurora-types';

import { useDensityContext, useElevationContext, useThemeContext } from '../../hooks';
import { ThemedClassName } from '../../util';

interface ButtonProps extends ThemedClassName<ComponentPropsWithRef<typeof Primitive.button>> {
  variant?: 'default' | 'primary' | 'outline' | 'ghost';
  density?: Density;
  elevation?: Elevation;
  asChild?: boolean;
}

type ButtonGroupContextValue = { inGroup?: boolean };
const BUTTON_GROUP_NAME = 'ButtonGroup';
const BUTTON_NAME = 'Button';
const [ButtonGroupProvider, useButtonGroupContext] = createContext<ButtonGroupContextValue>(BUTTON_GROUP_NAME, {
  inGroup: false,
});

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, density: propsDensity, elevation: propsElevation, variant = 'default', asChild, ...rootSlot }, ref) => {
    const { inGroup } = useButtonGroupContext(BUTTON_NAME);
    const { tx } = useThemeContext();
    const elevation = useElevationContext(propsElevation);
    const density = useDensityContext(propsDensity);
    const Root = asChild ? Slot : Primitive.button;
    return (
      <Root
        ref={ref}
        {...rootSlot}
        className={tx(
          'button.root',
          'button',
          {
            variant,
            inGroup,
            disabled: rootSlot.disabled,
            density,
            elevation,
          },
          rootSlot.className,
        )}
        {...(rootSlot.disabled && { disabled: true })}
      >
        {children}
      </Root>
    );
  },
);

Button.displayName = BUTTON_NAME;

type ButtonGroupProps = ComponentPropsWithoutRef<'div'> & { elevation?: Elevation };

const ButtonGroup = ({ children, elevation: propsElevation, ...divProps }: ButtonGroupProps) => {
  const { tx } = useThemeContext();
  const elevation = useElevationContext(propsElevation);
  return (
    <div role='none' {...divProps} className={tx('button.group', 'button-group', { elevation }, divProps.className)}>
      <ButtonGroupProvider inGroup>{children}</ButtonGroupProvider>
    </div>
  );
};

ButtonGroup.displayName = BUTTON_GROUP_NAME;

export { Button, ButtonGroup, BUTTON_GROUP_NAME, useButtonGroupContext };

export type { ButtonProps, ButtonGroupProps };
