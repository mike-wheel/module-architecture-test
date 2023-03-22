import React from 'react';
import { string, shape } from 'prop-types';
import { fullName } from '@kidcasa/utils';
import { css } from '@emotion/core';
import { Avatar, COLORS, SIZES } from '@brightwheel/casa';

const propTypes = {
  student: shape({
    object_id: string.isRequired,
    first_name: string,
    last_name: string,
    profile_photo: shape({
      thumbnail_url: string,
    }),
  }).isRequired,
};

const StudentPill = props => {
  const { student = {} } = props;

  const name = fullName(student);

  return (
    <div
      css={css`
        display: flex;
        flex: none;
        align-items: center;
        padding: 0.5rem 1rem;
        border-radius: 50%;
        font-size: ${SIZES.md};
        background-color: ${COLORS.neutral.cloud};
        border-radius: 9999px; // Hack to make pill shape
        line-height: 1rem;
      `}
    >
      <Avatar imageUrl={student.profile_photo?.thumbnail_url} size={'xs'} name={name} />
      <span
        css={css`
          padding-left: 0.5rem;
          text-align: left;
          white-space: nowrap;
        `}
      >
        {name}
      </span>
    </div>
  );
};

StudentPill.propTypes = propTypes;
export default StudentPill;
