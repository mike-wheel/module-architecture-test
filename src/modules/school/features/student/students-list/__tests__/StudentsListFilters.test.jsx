import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

import { setupServer, rest } from '@mswServer';
import { getRoomsMock } from './rooms.mock';
import { getStudentsMock } from './students.mock';

import SchoolStudentsFilters from '../StudentsListFilters/StudentsListFilters';

import { resetAllText } from '../constants';

const INITIAL_FILTERS = {
  enrollment_status: ['Active'],
  room: '',
  name_like: '',
};

expect.extend(toHaveNoViolations);

jest.mock('axios', () => {
  const originalModule = jest.requireActual('axios');
  return originalModule;
});

const server = setupServer(
  rest.get(`${global.API_URL}/api/v1/schools/:school_id/rooms`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(getRoomsMock()))
  ),
  rest.get(`${global.API_URL}/api/v1/schools/:school_id/students`, (req, res, ctx) =>
    res(ctx.status(200), ctx.json(getStudentsMock()))
  )
);

const generateProps = () => ({
  onSubmit: jest.fn(),
  onReset: jest.fn(),
  filters: INITIAL_FILTERS,
});

beforeEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('SchoolStudentsFilters', () => {
  it('renders', () => {
    const props = generateProps();
    render(<SchoolStudentsFilters onSubmit={props.onSubmit} onReset={props.onReset} initialValues={props.filters} />);

    screen.getByLabelText('Room');
    screen.getByLabelText('Student');
    screen.getByLabelText('Student status');
  });

  // the casa Chip component has a clear button without a name.
  // This test will fail when passed the default initial filters as it includes a status which renders as a Chip
  it('does not have basic accessibility violations', async () => {
    const props = generateProps();
    const { container } = render(
      <SchoolStudentsFilters onSubmit={props.onSubmit} onReset={props.onReset} initialValues={{}} />
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('calls onSubmit when the form is changed', async () => {
    const props = generateProps();
    render(<SchoolStudentsFilters onSubmit={props.onSubmit} onReset={props.onReset} initialValues={props.filters} />);

    const roomSelect = screen.getByLabelText('Room');
    const studentSelect = screen.getByLabelText('Student');
    // wait for fields to fetch their data
    await waitFor(() => expect(screen.queryAllByRole('status').length).toBe(2));
    await waitFor(() => expect(screen.queryAllByRole('status').length).toBe(0));

    userEvent.click(roomSelect);
    userEvent.click(screen.getByText('Demo Room'));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith({
        enrollment_status: ['Active'],
        name_like: '',
        room: '28f215a3-242b-44d6-b985-8f1dab563636',
      })
    );

    userEvent.click(studentSelect);
    userEvent.click(screen.getByText('George Harrison'));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith({
        enrollment_status: ['Active'],
        room: '28f215a3-242b-44d6-b985-8f1dab563636',
        name_like: 'George Harrison',
      })
    );
  });

  it('calls onReset when the reset button is hit', async () => {
    const props = generateProps();
    render(<SchoolStudentsFilters onSubmit={props.onSubmit} onReset={props.onReset} initialValues={props.filters} />);

    userEvent.click(screen.getByRole('button', { name: resetAllText }));
    expect(props.onReset).toHaveBeenCalled();
  });

  it('renders the filter values passed into it', async () => {
    const props = generateProps();
    const filters = {
      enrollment_status: ['Active'],
      name_like: 'Eric Clapton',
      room: 'fc969dd4-ba31-44ac-b6e3-6b58ae43bce2',
    };
    render(<SchoolStudentsFilters onSubmit={props.onSubmit} onReset={props.onReset} initialValues={filters} />);

    // wait for fields to fetch their data
    await waitFor(() => expect(screen.queryAllByRole('status').length).toBe(2));
    await waitFor(() => expect(screen.queryAllByRole('status').length).toBe(0));

    await screen.findByText('Abbey Road');
    await screen.findByText('Eric Clapton');
    screen.getByText('Active');
  });
});
