import React from 'react';
// components
import { useForm, TertiaryButton } from '@brightwheel/casa';
import { StudentFilter, StudentStatusFilter, RoomFilter } from '@kidcasa/form-elements';
// util
import { fullName } from '@kidcasa/utils';
import { resetAllText } from '../constants';
// styles
import { filterStyles } from './styles';
import { arrayOf, bool, func, shape, string } from 'prop-types';

const transformStudents = (students = []) =>
  students.map(student => {
    const fName = fullName(student);
    return {
      name: fName,
      id: fName, // this value is passed to name_like, so it should be the text of the students full name instead of object_id
    };
  });

const StudentsListFilters = ({ initialValues = {}, onSubmit, onReset, omitRoom = false }) => {
  const { filterProps, formik } = useForm({
    initialValues,
    onSubmit: values => onSubmit(values),
    submitOnChange: true,
    enableReinitialize: true,
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <div css={filterStyles.wrapper}>
        <StudentFilter {...filterProps('name_like')} transformStudents={transformStudents} />
        <StudentStatusFilter {...filterProps('enrollment_status')} isMulti />

        {/* RoomStudentsPage shouldn't show the RoomFilter! */}
        {!omitRoom ? <RoomFilter {...filterProps('room')} /> : null}

        {/* 
          hiding until https://brightwheel.atlassian.net/browse/COR-2731 is done
          <AttendanceStatusFilter {...filterProps('attendance_status')} />  
        */}
        <TertiaryButton type="button" version={'v2'} size={'xs'} onClick={onReset} css={filterStyles.resetAll}>
          {resetAllText}
        </TertiaryButton>
      </div>
    </form>
  );
};

StudentsListFilters.propTypes = {
  initialValues: shape({
    room: string,
    name_like: string,
    enrollment_status: arrayOf(string), // see enrollmentStatusOptions in enrollment_status_constants.js
  }),
  onSubmit: func.isRequired,
  onReset: func.isRequired,
  omitRoom: bool,
};

export default StudentsListFilters;
