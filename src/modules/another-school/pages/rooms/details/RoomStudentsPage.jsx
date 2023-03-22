import React, { useEffect } from 'react';
import { string } from 'prop-types';
import { LAYOUT, ErrorBlankState, LoadingOverlay } from '@brightwheel/casa';
import { css } from '@emotion/core';
import {
  StudentsListFilters,
  StudentsListPagination,
  StudentsListSort,
  StudentTable,
  useStudentsList,
} from '@kidcasa/students/StudentsList';

const propTypes = {
  roomId: string.isRequired,
};

const RoomStudentsPage = props => {
  const { roomId } = props;

  const {
    errorMessage,
    filters,
    sortKey,
    handleNextPage,
    // handlePageSize,
    handlePrevPage,
    pagination: { count = 0, page, page_size: pageSize },
    handleAction,
    isFetching,
    resetForm,
    setFilters,
    setSortKey,
    result: { students },
  } = useStudentsList({
    initialFilters: {
      enrollment_status: ['Active'],
      room: '', // this will be updated in the useEffect below
      name_like: '',
    },
    storageKey: 'RoomStudentsPage',
  });

  useEffect(() => {
    // Set the roomId on load
    // Do this here instead of in the initialFilters above because setFilters also updates localStorage
    setFilters({ room: roomId });

    // adding setFilters to the deps array causes an infiniate loop
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      css={css`
        max-width: ${LAYOUT.maxWidth};
        margin: 0 auto 6rem;
        padding: 0 ${LAYOUT.gutter};
      `}
    >
      <div
        css={css`
          margin-bottom: 2rem;
        `}
      >
        <StudentsListFilters onSubmit={setFilters} initialValues={filters} onReset={resetForm} omitRoom />
      </div>
      <LoadingOverlay isLoading={isFetching}>
        {errorMessage ? (
          <ErrorBlankState
            primaryMessage="There was an error loading the student list"
            secondaryMessage={errorMessage}
            width={'full'}
            variant="generic"
          />
        ) : (
          <>
            <StudentsListSort onSort={setSortKey} sortKey={sortKey} />
            <StudentTable
              key={JSON.stringify(filters)} // clear the selected row state when the filters change
              students={students}
              isFetching={isFetching}
              onReset={resetForm}
              onAction={handleAction}
              bulkActions={[
                {
                  label: 'Change student status',
                  visibilityFn: () => true,
                  onClick: () => {
                    console.log('Change student status');
                  },
                },
                {
                  label: 'Change homeroom',
                  visibilityFn: () => true,
                  onClick: () => {
                    console.log('Change homeroom');
                  },
                },
              ]}
            />
            <StudentsListPagination
              count={count}
              page={page}
              pageSize={pageSize}
              handleNextPage={handleNextPage}
              handlePrevPage={handlePrevPage}
            />
          </>
        )}
      </LoadingOverlay>
    </div>
  );
};

RoomStudentsPage.propTypes = propTypes;
export default RoomStudentsPage;
