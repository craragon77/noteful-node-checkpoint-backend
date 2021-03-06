require('dotenv').config()
const path = require('path')
const express = require('express')
const xss = require('xss')
const FoldersService = require('./folders-service')
const FoldersRouter = express.Router()
const jsonParser = express.json()
const bodyParser = express.json()
const cors = require('cors')

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name)
})

FoldersRouter
    .route('/api/folders')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        FoldersService.getAllFolders(knexInstance)
            .then(folder => {
                res.json(folder.map(serializeFolder))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const {name} = req.body
        const knexInstance = req.app.get('db')
        const newFolder = {name}
        console.log(req.body.name)
        console.log(req.body)
        console.log(name)
        console.log(newFolder)
        for(const field of Object.entries(newFolder)) {
            if(![field]){
                //logger.error(`${field} is required`)
                return res.status(400).json({
                    error: {message: `Missing ${field} in request body`}
                })
            }
        }
        newFolder.name = name;
        
        FoldersService.insertFolders(knexInstance, newFolder)
            .then(folder => {
                res.status(201)
                    .location(path.posix.join(req.originalUrl, `${folder.id}`))
                    .json(serializeFolder(folder))
            })
            .catch(next)
    })

FoldersRouter
    .route('/api/folders/:id')
    .all(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const {id} = req.body
        const folder_id = {id}
        FoldersService.getById(knexInstance, folder_id)
        .then(folder => {
            if(!folder){
                return res.status(404).json({
                    error: {message: `This specific folder cannot be found`}
                })
            }
            res.folder = folder
            next()
            })
            .catch(next)
        })
        .get(jsonParser, (req, res, next) => {
            res.json(serializeFolder(res.folder))
        })
        .delete(jsonParser, (req, res, next) => {
            const knexInstance = req.app.get('db')
            const {id} = req.body
            const folder_id = {id}
            FoldersService.deleteFolder(knexInstance, folder_id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
        })
        .patch(bodyParser, (req, res, next) => {
            const knexInstance = req.app.get('db')
            const {id, name} = req.body
            const folderToUpdate = {name}
            const folder_id = {id}
            const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
            if(numberOfValues === 0){
                return res.status(400).json({
                    error: {
                        message: `Request body must contain a name`
                    }
                })
            }
        FoldersService.updateFolder(knexInstance, folder_id, folderToUpdate)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
        })

module.exports = FoldersRouter