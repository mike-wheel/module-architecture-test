import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithStudent, homeroom, room1 } from './StudentTable.mocks.js';
import { setupServer, rest } from '../../../../__mocks__/mswServer/mswServer.js';

import { useSession } from '@kidcasa/session';
import analytics from 'kidcasa/util/analytics';

jest.mock('kidcasa/util/analytics');

jest.mock('@kidcasa/session');
useSession.mockImplementation(() => ({
  school: {
    object_id: 'school-id-123',
  },
  user: {
    object_id: 'user-id-123',
    raw_passcode: '1234',
  },
}));

// TODO this shouldn't be needed because it's also done in setupServer, investigate
jest.mock('axios', () => {
  const originalModule = jest.requireActual('axios');
  return originalModule;
});

const checkInSuccessHandler = () =>
  rest.post(`${global.API_URL}/api/v1/activities`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ oh: 'yeah' }));
  });

const checkInFailureHander = (response = {}) =>
  rest.post(`${global.API_URL}/api/v1/activities`, (req, res, ctx) => {
    return res(ctx.status(500), ctx.json(response));
  });

const markAbsentSuccessHandler = studentId =>
  rest.post(`${global.API_URL}/api/v1/students/${studentId}/activities`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ oh: 'yeah' }));
  });

const markAbsentFailureHandler = (studentId, response = {}) =>
  rest.post(`${global.API_URL}/api/v1/students/${studentId}/activities`, (req, res, ctx) => {
    return res(ctx.status(500), ctx.json(response));
  });

const moveRoomSuccessHandler = studentId =>
  rest.post(`${global.API_URL}/api/v1/users/${studentId}/move_room`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ oh: 'yeah' }));
  });

const moveRoomFailureHandler = (studentId, response = {}) =>
  rest.post(`${global.API_URL}/api/v1/users/${studentId}/move_room`, (req, res, ctx) => {
    return res(ctx.status(500), ctx.json(response));
  });

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

describe('Check in', () => {
  it("should immediately check the student in if they're assigned to just one room", async () => {
    server.use(checkInSuccessHandler());

    const onAction = jest.fn();
    await renderWithStudent({ rooms: [homeroom()] }, { onAction });

    userEvent.click(screen.getByRole('button', { name: /Check in.*/ }));
    await screen.findByText('Check in'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ message: 'Art was checked in to Homeroom' });
    expect(analytics.track).toHaveBeenCalledWith('Check In/Out', { state: 'in' });
  });

  it('should open the modal if the student is assigned to multiple rooms', async () => {
    server.use(checkInSuccessHandler());

    const onAction = jest.fn();
    const getModal = () => screen.queryByTestId('check-in-modal');
    renderWithStudent({ rooms: [homeroom(), room1()] }, { onAction }); // << 2 rooms

    expect(getModal()).toBeNull(); // the modal shouldn't be open yet

    userEvent.click(screen.getByRole('button', { name: /Check in.*/ })); // click check in, should open modal

    // now the modal should be open, and the checkin mocks should not have been called yet
    expect(getModal()).not.toBeNull();
    expect(onAction).not.toHaveBeenCalled();

    userEvent.click(within(getModal()).getByLabelText('Room 1')); // select the room-1 radio button
    await waitFor(() => {
      userEvent.click(within(getModal()).getByRole('button', { name: 'Check in' })); // click check in button in the modal
    });
    await within(getModal()).findByText('Check in'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ message: 'Art was checked in to Room 1' });
    expect(analytics.track).toHaveBeenCalledWith('Check In/Out', { state: 'in' });
  });

  it('should show an error notification when the server call fails with message in repsonse', async () => {
    server.use(
      checkInFailureHander({
        checkins: 'checkin status cannot be duplicated',
        _errors: [
          {
            title: 'Cannot checkin student',
            message: "This student can't be checkidy-checked in",
            code: 'E2005',
            attribute: null,
          },
        ],
      })
    );

    const onAction = jest.fn();
    await renderWithStudent({ rooms: [homeroom()] }, { onAction });

    userEvent.click(screen.getByRole('button', { name: /Check in.*/ }));
    await screen.findByText('Check in'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({
      message: "Art can't be checkidy-checked in", // << from the api reponse
      type: 'error',
    });
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it('should show an error notification when the server call fails with fallback', async () => {
    server.use(checkInFailureHander());

    const onAction = jest.fn();
    await renderWithStudent({ rooms: [homeroom()] }, { onAction });

    userEvent.click(screen.getByRole('button', { name: /Check in.*/ }));
    await screen.findByText('Check in'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({
      message: 'There was a problem checking Art in to Homeroom',
      type: 'error',
    });
    expect(analytics.track).not.toHaveBeenCalled();
  });
});

describe('Check out', () => {
  it('should check out the student from a single room', async () => {
    server.use(checkInSuccessHandler());

    const onAction = jest.fn();
    await renderWithStudent({ rooms: [homeroom(['checked in'])] }, { onAction });

    userEvent.click(screen.getByRole('button', { name: /Check out.*/ }));
    await screen.findByText('Check out'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ message: 'Art has been checked out of Homeroom' });
    expect(analytics.track).toHaveBeenCalledWith('Check In/Out', { state: 'out' });
  });

  it('should check out the student from a two rooms', async () => {
    server.use(checkInSuccessHandler());

    const onAction = jest.fn();
    await renderWithStudent({ rooms: [homeroom(['checked in']), room1(['checked in'])] }, { onAction });

    userEvent.click(screen.getByRole('button', { name: /Check out.*/ }));
    await screen.findByText('Check out'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ message: 'Art has been checked out of 2 rooms' });
    expect(analytics.track).toHaveBeenCalledWith('Check In/Out', { state: 'out' });
  });

  it('should show an error notification when the server call fails with message in repsonse', async () => {
    server.use(
      checkInFailureHander({
        checkins: 'checkin status cannot be duplicated',
        _errors: [
          {
            title: 'Cannot checkin student',
            message: "This student can't be checkidy-checked out",
            code: 'E2005',
            attribute: null,
          },
        ],
      })
    );

    const onAction = jest.fn();
    await renderWithStudent({ rooms: [homeroom(['checked in'])] }, { onAction });

    userEvent.click(screen.getByRole('button', { name: /Check out.*/ }));
    await screen.findByText('Check out'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({
      message: "Art can't be checkidy-checked out", // << from the api reponse
      type: 'error',
    });
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it('should show an error notification when the server call fails with fallback', async () => {
    server.use(checkInFailureHander());

    const onAction = jest.fn();
    await renderWithStudent({ rooms: [homeroom(['checked in'])] }, { onAction });

    userEvent.click(screen.getByRole('button', { name: /Check out.*/ }));
    await screen.findByText('Check out'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({
      message: 'There was a problem checking out Art',
      type: 'error',
    });
    expect(analytics.track).not.toHaveBeenCalled();
  });
});

describe('Mark Absent', () => {
  it('should marks a student absent', async () => {
    const studentId = '1234';

    server.use(markAbsentSuccessHandler(studentId));

    const onAction = jest.fn();
    await renderWithStudent({ object_id: studentId, rooms: [homeroom(), room1()] }, { onAction });

    userEvent.click(screen.getByRole('button', { name: /Mark absent.*/ }));
    await screen.findByText('Mark absent'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ message: 'Art was marked absent' });
    expect(analytics.track).toHaveBeenCalledWith('Mark Absent');
  });

  it('should handle errors when marking a student absent with api error message', async () => {
    const studentId = '1234';

    server.use(
      markAbsentFailureHandler(studentId, {
        _errors: [
          {
            title: 'Cannot checkin student',
            message: "This student can't be marked absent, yo",
            code: 'E2005',
          },
        ],
      })
    );

    const onAction = jest.fn();
    await renderWithStudent({ object_id: studentId, rooms: [homeroom(), room1()] }, { onAction });

    userEvent.click(screen.getByRole('button', { name: /Mark absent.*/ }));
    await screen.findByText('Mark absent'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ message: "Art can't be marked absent, yo", type: 'error' });
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it('should handle errors when marking a student absent with fallback error message', async () => {
    const studentId = '1234';

    server.use(markAbsentFailureHandler(studentId));

    const onAction = jest.fn();
    await renderWithStudent({ object_id: studentId, rooms: [homeroom(), room1()] }, { onAction });

    userEvent.click(screen.getByRole('button', { name: /Mark absent.*/ }));
    await screen.findByText('Mark absent'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ message: 'There was an error marking Art absent', type: 'error' });
    expect(analytics.track).not.toHaveBeenCalled();
  });
});

describe('Move room', () => {
  it('should be able to move a student to another room', async () => {
    const studentId = '1234';

    server.use(moveRoomSuccessHandler(studentId));

    const onAction = jest.fn();
    await renderWithStudent({ object_id: studentId, rooms: [homeroom(), room1(['checked in'])] }, { onAction });

    await userEvent.click(screen.getByRole('button', { name: /Move room.*/ }));
    await userEvent.click(screen.getByText("(Art's homeroom)"));

    await screen.findByText('Move room'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ message: 'Art has been moved to Homeroom' });
    expect(analytics.track).toHaveBeenCalledWith('Move Room', { from_room: 'room-1', to_room: 'homeroom' });
  });

  it('should handle api errors moving a student to another room with the api message', async () => {
    const studentId = '1234';

    server.use(
      moveRoomFailureHandler(studentId, {
        _errors: [
          {
            title: 'Cannot checkin student',
            message: "This student can't be moved right now, yo",
            code: 'E2005',
          },
        ],
      })
    );

    const onAction = jest.fn();
    await renderWithStudent({ object_id: studentId, rooms: [homeroom(), room1(['checked in'])] }, { onAction });

    await userEvent.click(screen.getByRole('button', { name: /Move room.*/ }));
    await userEvent.click(screen.getByText("(Art's homeroom)"));

    await screen.findByText('Move room'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ message: "Art can't be moved right now, yo", type: 'error' });
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it('should handle api errors moving a student to another room with the a fallback message', async () => {
    const studentId = '1234';

    server.use(moveRoomFailureHandler(studentId));

    const onAction = jest.fn();
    await renderWithStudent({ object_id: studentId, rooms: [homeroom(), room1(['checked in'])] }, { onAction });

    await userEvent.click(screen.getByRole('button', { name: /Move room.*/ }));
    await userEvent.click(screen.getByText("(Art's homeroom)"));

    await screen.findByText('Move room'); // after the loader has finished

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ message: 'There was an error moving Art to Homeroom', type: 'error' });
    expect(analytics.track).not.toHaveBeenCalled();
  });
});
