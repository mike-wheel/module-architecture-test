import React from 'react';
import { func, number } from 'prop-types';
import Pagination from '@components/pagination';

const propTypes = {
  count: number.isRequired,
  page: number.isRequired,
  pageSize: number.isRequired,
  handleNextPage: func.isRequired,
  handlePrevPage: func.isRequired,
};

const StudentTablePagination = props => {
  const { count, handleNextPage, handlePrevPage, page, pageSize } = props;

  return count >= pageSize ? (
    <Pagination
      handleNextPage={handleNextPage}
      handlePrevPage={handlePrevPage}
      count={count}
      pageSize={pageSize}
      page={page + 1}
    />
  ) : (
    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
      {count} student{count !== 1 ? 's' : ''}
    </div>
  );
};

StudentTablePagination.propTypes = propTypes;
export default StudentTablePagination;
