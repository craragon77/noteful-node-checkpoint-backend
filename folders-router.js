require('dotenv').config()
const path = require('path')
const express = require('express')
const xss = require('xss')
const FoldersService = require('./folders-service')
const FoldersRouter = express.Router()
const jsonParser = express.json()

const serializeFolder = folder => ({
    id: folder.id,
    note_id: folder.note_id,
    title: xss(folder.title)
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
    .post(jsonParser, (req, res, next) => {
        const {id, note_id, title} = req.body
        const newFolder = {id, title}

        for(const [key, value] of Object.entries(newFolder)) {
            if(value == null){
                return res.status(400).json({
                    error: {message: `Missing ${key} in request body`}
                })
            }
        }
        newFolder.title = title;
        
        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder => {
                res.status(201)
                    .location(path.posix.join(req.originalUrl, `${folder.id}`))
                    .json(serializeFolder)
            })
            .catch(next)
    })

FoldersRouter
    .route('/api/folder/:folder_id')
    .all((req, res, next) => {
        FoldersService.getById(
            req.app.get('db'),
            req.params.user_id
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