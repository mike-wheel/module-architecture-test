import React from 'react';
import { renderWithRouter } from '@kidcasa/util/test-utils';
import StudentTable from '../StudentTable.jsx';

const generateStudent = overrides => {
  return {
    object_id: 'art-vandelay',
    first_name: 'Art',
    last_name: 'Vandelay',
    raw_passcode: '1234',
    profile_photo: {
      thumbnail_url: 'https://pbs.twimg.com/profile_images/1429575302/jasonalexander_profile-220x220_400x400.jpg',
    },
    rooms: [],
    ...overrides,
  };
};

export const homeroom = (statuses = []) => ({
  object_id: 'homeroom',
  name: 'Homeroom',
  is_default_room: true,
  is_checked_in: statuses.includes('checked in'),
  is_absent: statuses.includes('absent'),
});

export const room1 = (statuses = []) => ({
  object_id: 'room-1',
  name: 'Room 1',
  is_default_room: false,
  is_checked_in: statuses.includes('checked in'),
  is_absent: statuses.includes('absent'),
});

export const renderWithStudent = (overrides, props) => {
  return renderWithRouter(
    <StudentTable
      students={[generateStudent(overrides)]}
      isFetching={false}
      onReset={() => {}}
      onAction={action => {}}
      {...props}
    />
  );
};
