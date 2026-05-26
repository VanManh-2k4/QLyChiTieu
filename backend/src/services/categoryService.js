import * as categoryRepository from '../repositories/categoryRepository.js';
import { logActivity } from './historyService.js';

export function listAll() {
  return categoryRepository.listAll();
}

function normalizeType(type) {
  return type === 'income' || type === 'expense' ? type : null;
}

export function create(actorUserId, data) {
  const name = String(data?.name || '').trim();
  const type = normalizeType(data?.type);
  if (!name) {
    const err = new Error('Tên danh mục không được để trống');
    err.status = 400;
    throw err;
  }
  if (!type) {
    const err = new Error('Loại danh mục không hợp lệ');
    err.status = 400;
    throw err;
  }
  const existed = categoryRepository.findByNameAndType(name, type);
  if (existed) {
    const err = new Error('Danh mục đã tồn tại');
    err.status = 409;
    throw err;
  }
  const created = categoryRepository.create({ name, type });
  logActivity({
    userId: actorUserId,
    actionType: 'create',
    entityType: 'category',
    entityId: created.id,
    title: `Tạo danh mục ${created.name}`,
    details: `Loại: ${created.type}`,
  });
  return created;
}

export function update(actorUserId, categoryId, data) {
  const current = categoryRepository.findById(categoryId);
  if (!current) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  const name = String(data?.name || '').trim();
  const type = normalizeType(data?.type);
  if (!name) {
    const err = new Error('Tên danh mục không được để trống');
    err.status = 400;
    throw err;
  }
  if (!type) {
    const err = new Error('Loại danh mục không hợp lệ');
    err.status = 400;
    throw err;
  }
  const existed = categoryRepository.findByNameAndType(name, type);
  if (existed && Number(existed.id) !== Number(categoryId)) {
    const err = new Error('Danh mục đã tồn tại');
    err.status = 409;
    throw err;
  }
  const updated = categoryRepository.update(categoryId, { name, type });
  logActivity({
    userId: actorUserId,
    actionType: 'update',
    entityType: 'category',
    entityId: updated.id,
    title: `Sửa danh mục ${updated.name}`,
    details: `Loại: ${updated.type}`,
  });
  return updated;
}

export function remove(actorUserId, categoryId) {
  const current = categoryRepository.findById(categoryId);
  if (!current) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  const usedCount = categoryRepository.countUsage(categoryId);
  if (usedCount > 0) {
    const err = new Error('Danh mục đang được sử dụng, không thể xóa');
    err.status = 409;
    throw err;
  }
  categoryRepository.remove(categoryId);
  logActivity({
    userId: actorUserId,
    actionType: 'delete',
    entityType: 'category',
    entityId: categoryId,
    title: 'Xóa danh mục',
    details: `ID: ${categoryId}`,
  });
}
