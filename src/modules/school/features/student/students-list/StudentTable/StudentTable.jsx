import React, { useMemo } from 'react';
import { any, arrayOf, bool, func, shape, string } from 'prop-types';
import { css } from '@emotion/core';
import { DESIGN, Report, BlankState, TertiaryButton } from '@brightwheel/casa';
import { getAbsentRooms, getCheckedInRooms } from '../../students.data.js';

import DailyAttendance from './DailyAttendance.jsx';
import CheckIn from './CheckIn.jsx';
import CheckOut from './CheckOut.jsx';
import MarkAbsent from './MarkAbsent.jsx';
import Student from './Student.jsx';
import MoveRoom from './MoveRoom.jsx';

const propTypes = {
  students: arrayOf(
    shape({
      first_name: string.isRequired,
      last_name: string.isRequired,
      rooms: arrayOf(
        shape({
          object_id: string,
          name: string,
          is_default_room: bool,
          is_checked_in: bool,
          is_absent: bool,
        })
      ).isRequired,
    })
  ),
  isFetching: bool,
  onReset: func,
  onAction: func,
  bulkActions: any, // will be checked by Report
};

const StudentTablePlaceholder = props => {
  const { onReset } = props;

  return (
    <div
      style={{
        height: '30vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <BlankState
        icon={'search'}
        primaryMessage={'No results found based on your filters'}
        secondaryMessage={'Try a different combination or reset them to start over.'}
        action={
          <TertiaryButton version="v2" onClick={onReset}>
            Reset filters
          </TertiaryButton>
        }
      />
    </div>
  );
};

const StudentTable = props => {
  const { students = [], onReset, onAction, bulkActions } = props;

  // see https://react-table-v7.tanstack.com/docs/api/useTable#column-options
  const columns = useMemo(
    () => [
      {
        accessor: row => `${row.first_name ?? ''} ${row.last_name ?? ''}`,
        id: 'student',
        Header: 'Student',
        Cell: ({ row }) => <Student student={row.original} />,
      },
      {
        accessor: 'dailyAttendance',
        id: 'dailyAttendance',
        Header: 'Daily attendance',
        Cell: ({ row }) => {
          const student = row.original;
          return <DailyAttendance student={student} />;
        },
      },
      {
        accessor: 'move-absent',
        id: 'move-absent',
        Header: () => <span css={DESIGN.visuallyHidden}>Mark absent or Move Room</span>,
        Cell: ({ row }) => {
          const student = row.original;

          const isCheckedIn = getCheckedInRooms(student).length > 0;
          const isAbsent = getAbsentRooms(student).length > 0;
          const isAssignedToRooms = student.rooms.length > 0;

          return (
            <>
              {isCheckedIn ? <MoveRoom student={student} onSelect={onAction} /> : null}
              {!isCheckedIn && !isAbsent && isAssignedToRooms ? (
                <MarkAbsent student={student} onMarkedAbsent={onAction} />
              ) : null}
            </>
          );
        },
      },
      {
        accessor: 'check-in-out',
        id: 'check-in-out',
        Header: () => <span css={DESIGN.visuallyHidden}>Check in or out</span>,
        Cell: ({ row }) => {
          const student = row.original;
          const isCheckedIn = getCheckedInRooms(student).length > 0;

          return (
            <div
              css={css`
                text-align: right;
              `}
            >
              {isCheckedIn ? (
                <CheckOut student={student} onCheckOut={onAction} />
              ) : (
                <CheckIn student={student} onCheckIn={onAction} />
              )}
            </div>
          );
        },
      },
    ],
    [onAction]
  );

  return (
    <Report
      columns={columns}
      data={students || []}
      Placeholder={<StudentTablePlaceholder onReset={onReset} />}
      bulkActions={bulkActions}
      dataLabel="student"
      rowPropsFn={({ row, report }) => ({
        onClick: () => {}, // Hack to prevent the row from being selected on row click
      })}
      css={css`
        // hack so that the Move Room dropdown doesn't get cut off when open
        * {
          overflow: visible;
        }

        // override the table layout so the column widths can be controlled
        table {
          table-layout: auto;
        }

        // Warning from emotion: The pseudo class ":nth-child" is potentially unsafe when doing server-side rendering.
        //   Try changing it to ":nth-of-type".
        // student column should be at least 25vw on small screens, and max out ot 22rem for large screens
        [role='columnheader']:nth-of-type(${bulkActions ? 2 : 1}) {
          min-width: 25vw;

          @media (min-width: 88rem) {
            min-width: 22rem;
          }
        }

        // the tag column should grow to fill
        [role='columnheader']:nth-of-type(${bulkActions ? 3 : 2}) {
          width: 100%;
        }

        button {
          white-space: nowrap;
        }

        /* hack to fix the bulk actions bar. This can be removed if we fix this upstream https://github.com/brightwheel/casa/pull/718 */
        aside {
          position: sticky;
          bottom: 0;
        }

        /* hack to reset the cursor and hover, since the row is no longer clickable because of the rowPropsFn onClick hack above */
        tr {
          cursor: default;

          &:hover {
            --bgc3: var(--default-row-background-color);
          }
        }
      `}
    />
  );
};

StudentTable.propTypes = propTypes;
export default StudentTable;
