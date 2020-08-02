const fs = require('fs');

const path = require('path');

const Recipe = require('../models/recipe');

exports.getRecipes = async(req, res, next) =>{
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try{
        const totalRecipes = await Recipe.find().countDocuments();
        const recipes = await Recipe.find().populate('chef').sort({createdAt: -1})
            .skip((currentPage - 1) * perPage).limit(perPage);
        res.status(200).json({
            message: 'Recipes Fetched Successfully.',
            recipes: recipes,
            totalItems: totalRecipes
        });
    }catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getRecipe = async(req,res,next) =>{
  const recipeId = req.params.recipeId;
  try {
      const recipe =await Recipe.findById(recipeId);
      if (!recipe){
          const error = new Error('Post not found.');
          error.status = 404;
          throw error;
      }
      res.status(200).json({
          message: 'Recipe Fetched',
          post: recipe
      });
  }catch (err){
      if (!err.statusCode) {
          err.statusCode = 500;
      }
      next(err);
  }
};


