require('dotenv').config()
const path = require('path')
const express = require('express')
const xss = require('xss')
const FoldersService = require('./folders-service')
const FoldersRouter = express.Router()
const jsonParser = express.json()
const bodyParser = express.json()

const serializeFolder = folder => ({
    id: folder.id,
    note_id: folder.note_id,
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
                    .json(serializeFolder)
            })
            .catch(next)
    })

FoldersRouter
    .route('/api/folder/:id')
    .all((req, res, next) => {
        FoldersService.getById(
            req.app.get('db'),
            req.params.id
        )
        .then(folder => {
            if(!folder){
                return res.status(404).json({
                    error: {message: `This specific folder cannot be found`}
                })
            }
            res.user = user
            next()
        })
        .get((req, res, next) => {
            res.json(serializeFolder(res.folder))
        })
        .delete((req, res, next) => {
            FoldersService.deleteFolder(
                req.app.get(db),
                req.params.id
            )
            .then(numRowsAffected => {
                res.status(204).end
            })
            .catch(next)
        })
        .patch(jsonParser, (req, res, next) => {
            const {id, note_id, title} = req.body
            const folderToUpdate = {title}

            const numberOfValues = Object.value(folderToUpdate).filter(Boolean).length
            if (numberOfValues === 0)
                return res.status(400).json({
                    error: {message: `Request body must contain either a title`}
                })
            })
            FoldersService.updateFolder(
                req.app.get('db'),
                req.params.id,
                folderToUpdate
            )
                .then(numRowsAffected => {
                    res.status(204).end()
                })
                .catch(next)
    })

module.exports = FoldersRouter