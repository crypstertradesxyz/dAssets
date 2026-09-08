import React from 'react';
import { Composition } from 'remotion';
import { AnnouncementVideo } from './AnnouncementVideo';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Announcement"
      component={AnnouncementVideo}
      durationInFrames={480}
      fps={30}
      width={1080}
      height={1080}
    />
  );
};
