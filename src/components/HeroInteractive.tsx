"use client"

import React, { useState } from 'react';
import { Button } from './Button';
import EmailSignupForm from './EmailSignupForm';

interface HeroInteractiveProps {
  // Any props that the parent LandingPage might want to pass down
}

const HeroInteractive: React.FC<HeroInteractiveProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} >Get Started for Free</Button>

      <EmailSignupForm open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default HeroInteractive;
