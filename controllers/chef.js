const fs = require('fs');

const path = require('path');

const Recipe = require('../models/recipe');

const Chef = require('../models/chef');

const Category = require('../models/category');

exports.getChefRecipes = async (req, res, next) => {
    const totalRecipes = await Recipe.find({chef:req.userId}).countDocuments();
    const recipes = await Recipe.find({chef:req.userId});
    try {
        if (!recipes || totalRecipes === null){
            const error = new Error('No recipes found');
            error.statusCode = 404;
            return next(error);
        }
        res.status(200).json({
            message: 'Recipes Fetched Successfully.',
            recipes: recipes,
            totalItems: totalRecipes
        });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getChefRecipe = async (req, res, next) => {
    const recipeId = req.params.recipeId;
    try {
        const recipe =await Recipe.findById(recipeId).populate('chef');
        if (!recipe){
            const error = new Error('Recipe not found.');
            error.status = 404;
            throw error;
        }
        if (recipe.chef._id.toString() !== req.userId){
            const error = new Error('Not Authorized.');
            error.statusCode = 403;
            throw error;
        }
        res.status(200).json({
            message: 'Recipe Fetched',
            recipe: recipe
        });
    }catch (err){
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

//TODO: CHECK THIS CONTROLLER
exports.postRecipe = async(req, res, next)=>{
    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        return next(error);
    }
    const chef = req.userId; //TODO: check this step
    const actualChef = await Chef.findById(req.userId);
    if(!actualChef){
        const error = new Error('No chef with this id exists');
        error.statusCode = 404;
        return next(error);
    }
    if(actualChef._id.toString() !== chef){
        const error = new Error('Not Authorized.');
        error.statusCode = 403;
        return next(error);
    }
    const title = req.body.title;
    const imageUrl = req.file.path; //generated by multer that holds path to image
    const duration = req.body.duration;
    const affordability = req.body.affordability;
    const complexity = req.body.complexity;
    const isVegetarian = req.body.isVegetarian;
    const ingredients = req.body.ingredients;
    const categoryIds = req.body.categories;
    const steps = req.body.steps;
    const recipe = new Recipe({
        title: title,
        imageUrl: imageUrl,
        duration: duration,
        ingredients: ingredients,
        categories: categoryIds, //TODO: Check if we still can push id's as array directly
        steps:steps,
        chef: chef,
        complexity: complexity,
        affordability: affordability,
        isVegetarian: isVegetarian
    });
    try{
        await recipe.save();
        const chef = await Chef.findById(req.userId);
        chef.recipes.push(recipe);
        await chef.save();
        async function saveIds () {
            for (const id of categoryIds) {
                const category = await Category.findById(id);
                category.recipes.push(recipe);
                await category.save();
            }
        }
        await saveIds();
        res.status(201).json({
            message: 'Recipe created successfully',
            recipe: recipe,
            creator: {
                _id: recipe.chef,
                name: chef.name
            },
        });
    }catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updateRecipe = async (req, res, next) =>{
    const recipeId = req.params.recipeId;
    const title = req.body.title;
    let imageUrl = req.body.image; //generated by multer that holds path to image
    const chef = req.body.chef;
    const duration = req.body.duration;
    const affordability = req.body.affordability;
    const complexity = req.body.complexity;
    const isVegetarian = req.body.isVegetarian;
    const ingredients = req.body.ingredients;
    const categories = req.body.categories;
    const steps = req.body.steps;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }
    try{
        const recipe = await Recipe.findById(recipeId).populate('creator');
        if (!recipe){
            const error = new Error('Could not find recipe.');
            error.statusCode = 404;
            throw error;
        }
        if (recipe.chef._id.toString() !== req.userId) {
            const error = new Error('Not Authorized.');
            error.statusCode = 403;
            throw error;
        }
        if (imageUrl !== recipe.imageUrl) { //new image was uploaded
            clearImage(recipe.imageUrl);
        }
        for (const id of recipe.categories) {
            const category = await Category.findById(id);
            category.recipes.pull(recipe);
            await category.save();
        }
        recipe.title = title;
        recipe.chef = chef; //TODO: req.userId
        recipe.duration = duration;
        recipe.affordability = affordability;
        recipe.complexity = complexity;
        recipe.imageUrl = imageUrl;
        recipe.isVegetarian = isVegetarian;
        recipe.ingredients = ingredients;
        recipe.categories = categories;
        recipe.steps = steps;
        async function saveIds () {
            for (const id of categories) {
                const category = await Category.findById(id);
                category.recipes.push(recipe);
                await category.save();
            }
        }
        await saveIds();
        const result = await recipe.save();
        res.status(200).json({
            message: 'Recipe updated!',
            result: result
        });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.deleteRecipe = async (req, res, next) => {
    const recipeId = req.params.recipeId;
    console.log(recipeId);
    try {
        const recipe = await Recipe.findById(recipeId);
        if (!recipe){
            const error = new Error('Could not find recipe.');
            error.statusCode = 404;
            throw error;
        }
        if (recipe.chef._id.toString() !== req.userId) {
            const error = new Error('Not Authorized.');
            error.statusCode = 403;
            throw error;
        }
        clearImage(recipe.imageUrl);
        await Recipe.findByIdAndRemove(recipeId);
        const chef = await Chef.findById(req.userId);
        chef.recipes.pull(recipeId);
        for (const id of recipe.categories) {
            const category = await Category.findById(id);
            category.recipes.pull(recipe);
            await category.save();
        }
        await chef.save();
        res.status(200).json({
            message: 'Recipe deleted.'
        });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

//helper function to delete image
const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};
