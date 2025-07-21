import { apiRequest } from './api';

// Check admin status
export async function checkAdminStatus() {
  return apiRequest('/admin/check');
}

// Reports
export async function getAllReports() {
  return apiRequest('/admin/reports');
}
export async function getReportById(reportId) {
  return apiRequest(`/admin/reports/${reportId}`);
}
export async function resolveReport(reportId) {
  return apiRequest(`/admin/reports/${reportId}/resolve`, { method: 'PUT' });
}
export async function deleteReport(reportId) {
  return apiRequest(`/admin/reports/${reportId}`, { method: 'DELETE' });
}

// Posts
export async function getAllPosts() {
  return apiRequest('/admin/posts');
}
export async function getPostById(postId) {
  return apiRequest(`/admin/posts/${postId}`);
}
export async function editPost(postId, data) {
  return apiRequest(`/admin/posts/${postId}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deletePost(postId) {
  return apiRequest(`/admin/posts/${postId}`, { method: 'DELETE' });
}

// Comments
export async function getAllComments() {
  return apiRequest('/admin/comments');
}
export async function deleteComment(commentId) {
  return apiRequest(`/admin/comments/${commentId}`, { method: 'DELETE' });
}

// Users
export async function getAllUsers() {
  return apiRequest('/admin/users');
}
export async function blockUser(userId) {
  return apiRequest(`/admin/users/${userId}/block`, { method: 'PUT' });
}
export async function unblockUser(userId) {
  return apiRequest(`/admin/users/${userId}/unblock`, { method: 'PUT' });
}
export async function editUserProfile(userId, data) {
  return apiRequest(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteUser(userId) {
  return apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
}
export async function promoteToAdmin(userId) {
  return apiRequest(`/admin/users/${userId}/promote`, { method: 'PUT' });
}
export async function demoteFromAdmin(userId) {
  return apiRequest(`/admin/users/${userId}/demote`, { method: 'PUT' });
}