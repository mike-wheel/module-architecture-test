import React from 'react';
import { arrayOf, bool, shape, string } from 'prop-types';
import { css } from '@emotion/core';
import { Tag } from '@brightwheel/casa';
import { getAbsentRooms, getCheckedInRooms } from '../../students.data.js';

const propTypes = {
  student: shape({
    rooms: arrayOf(
      shape({
        object_id: string,
        name: string,
        is_default_room: bool,
        is_checked_in: bool,
        is_absent: bool,
      })
    ).isRequired,
  }).isRequired,
};

const DailyAttendance = props => {
  const { student } = props;

  return [
    ...getCheckedInRooms(student).map(room => (
      <TagWithPadding theme="teal" key={`in-${room.object_id}`} text={`In ${room.name}`} />
    )),
    ...getAbsentRooms(student).map(room => (
      <TagWithPadding theme="graphite" key={`absent-${room.object_id}`} text={`Absent - ${room.name}`} />
    )),
  ];
};

// add padding so there is space when the tags wrap
const TagWithPadding = props => {
  return (
    <span
      css={css`
        display: inline-block;
        padding: 0.125rem;

        // hack to override the Tag span so it looks ok when the tag text wraps
        span {
          line-height: 1.15;
          padding: ${7 / 16}rem 0;
        }
      `}
    >
      <Tag {...props} />
    </span>
  );
};

DailyAttendance.propTypes = propTypes;
export default DailyAttendance;
