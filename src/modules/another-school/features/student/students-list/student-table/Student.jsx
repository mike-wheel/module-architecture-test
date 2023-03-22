import React from 'react';
import { arrayOf, shape, string } from 'prop-types';
import { Avatar, COLORS, SIZES } from '@brightwheel/casa';
import { css } from '@emotion/core';
import { Link } from 'react-router-dom';
import { fullName } from '@kidcasa/utils';
import { sortRooms } from '@kidcasa/students/students.data';

const propTypes = {
  student: shape({
    object_id: string.isRequired,
    first_name: string,
    last_name: string,
    profile_photo: shape({
      thumbnail_url: string,
    }),
    rooms: arrayOf(
      shape({
        name: string.isRequired,
      })
    ),
  }).isRequired,
};

const Student = props => {
  const { student } = props;
  const { object_id, profile_photo, rooms = [] } = student;

  const name = fullName(student);

  return (
    <Link to={`/students/${object_id}/profile`}>
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <div
          css={css`
            padding-right: ${SIZES.xs};
          `}
        >
          <Avatar imageUrl={profile_photo?.thumbnail_url} size={'sm'} name={name} />
        </div>
        <div>
          <div
            css={css`
              line-height: 1.15;
              padding-bottom: 0.25rem;
            `}
          >
            {name}
          </div>
          <div
            css={css`
              font-size: ${SIZES.sm};
              color: ${COLORS.neutral.graphite};
              line-height: 1.33;
            `}
          >
            {sortRooms(rooms)
              .map(room => room.name)
              .join(', ')}
          </div>
        </div>
      </div>
    </Link>
  );
};

Student.propTypes = propTypes;
export default Student;
