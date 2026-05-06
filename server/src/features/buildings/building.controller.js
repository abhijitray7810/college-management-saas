import { buildingService } from './building.service.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';

export const buildingController = {
  create: catchAsync(async (req, res) => {
    const building = await buildingService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Building created successfully',
      data: building,
    });
  }),

  getAll: catchAsync(async (req, res) => {
    const buildings = await buildingService.getAll();
    res.status(200).json({
      success: true,
      data: buildings,
    });
  }),

  getById: catchAsync(async (req, res) => {
    const building = await buildingService.getById(req.params.id);
    res.status(200).json({
      success: true,
      data: building,
    });
  }),

  update: catchAsync(async (req, res) => {
    const building = await buildingService.update(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Building updated successfully',
      data: building,
    });
  }),

  delete: catchAsync(async (req, res) => {
    const result = await buildingService.delete(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }),
};
