import { floorService } from './floor.service.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';

export const floorController = {
  create: catchAsync(async (req, res) => {
    const floor = await floorService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Floor created successfully',
      data: floor,
    });
  }),

  getAll: catchAsync(async (req, res) => {
    const floors = await floorService.getAll(req.query);
    res.status(200).json({
      success: true,
      data: floors,
    });
  }),

  getById: catchAsync(async (req, res) => {
    const floor = await floorService.getById(req.params.id);
    res.status(200).json({
      success: true,
      data: floor,
    });
  }),

  assignToDepartment: catchAsync(async (req, res) => {
    const floor = await floorService.assignToDepartment(req.params.id, req.body.departmentId);
    res.status(200).json({
      success: true,
      message: 'Floor assigned to department successfully',
      data: floor,
    });
  }),

  update: catchAsync(async (req, res) => {
    const floor = await floorService.update(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Floor updated successfully',
      data: floor,
    });
  }),

  delete: catchAsync(async (req, res) => {
    const result = await floorService.delete(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }),
};
