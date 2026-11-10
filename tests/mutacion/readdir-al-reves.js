/**
 * Simula un sistema de ficheros que lista en otro orden (NTFS ordena, ext4
 * no): `readdirSync` devuelve las entradas al revés. Lo carga un caso de
 * mutación con NODE_OPTIONS=--require; un derivado que dependa del orden en
 * que el disco lista los ficheros cambia y su guardián lo ve.
 */
'use strict';
const fs = require('fs');
const original = fs.readdirSync;
fs.readdirSync = function (...args) { return original.apply(this, args).slice().reverse(); };
