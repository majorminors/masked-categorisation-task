% function generate_noise_masks(rootDir)
clc;
clear all;
close all;

rootDir = 'stimuli'; % this expects to be run from top level (above stimuli), and directories are hard coded!
inputExt = '.jpg';
outputExt = '.jpg';

% some settings
noise_spatial_freq=-1;% -1 =1/f; -2=1/f^2; ...
noise_intensity=128;

outfld = fullfile(rootDir,'masks');
if ~exist(outfld,'dir')
    mkdir(outfld);
end

disp('copying files')
allCats = dir(fullfile(rootDir,'masked_datasets'));
for i=1:length(allCats)
    if allCats(i).isdir && ~ismember({allCats(i).name}, {'.', '..'})
        catName = allCats(i).name;
        if ~exist(fullfile(outfld,catName),'dir'); mkdir(fullfile(outfld,catName)); end
        allExemps = dir(fullfile(rootDir,'masked_datasets',catName));
        for j=1:length(allExemps)
            if allExemps(j).isdir && ~ismember({allExemps(j).name}, {'.', '..'})
                exempName = allExemps(j).name;
                first_image = dir(fullfile(rootDir,'masked_datasets',catName, exempName));
                first_image_name = first_image(3).name; % third to get around . and .. flds
                copyfile(fullfile(rootDir,'masked_datasets',catName,exempName,'1',[first_image_name inputExt]),fullfile(outfld,catName,[exempName inputExt]),'f')
            end
        end
    end
end



% get list of all sub directories
allsubs = dir(fullfile(rootDir, 'masks','**'));
isdir = [allsubs.isdir] & ~ismember({allsubs.name}, {'.', '..'});
allsubdirs = fullfile({allsubs(isdir).folder}, {allsubs(isdir).name});


% loop through all sub directories
for dirNum = 1:length(allsubdirs)
    
    % get list of all files in sub dir i
    dirContent = dir(allsubdirs{dirNum});
    dirFiles = {dirContent.name};
    
    % get just the image files
    imgFilesIdx = ~cellfun(@isempty, regexp(dirFiles, inputExt));
    
    % list the image files
    imgFiles = dirFiles(imgFilesIdx);
       
    % loop through all image files
    for imgNum = 1:length(imgFiles)
        fprintf('noising img %.0f of %.0f in dir %.0f of %.0f\n',imgNum,length(imgFiles),dirNum,length(allsubdirs));
        
        % make the current file easy to reference
        theFile = fullfile(allsubdirs{dirNum}, imgFiles{imgNum});
        
        % collate these filenames so we can normalise them
        if ~exist('allImgFiles','var'); allImgFiles = {theFile}; else allImgFiles = [allImgFiles, {theFile}]; end
        
        % get the file name (no path or extension)
        [~,imgName,~] = fileparts(theFile);
        
        % read data from image file j in directory i
        thisImage = imread(theFile);
        
        % get the pixel size of the image
        [mask_height, mask_width, ~] = size(thisImage);
        
        %mask_width=500;
        %mask_height=700;
        
        % get the noise mask
        Noise_mask=spatialPattern([mask_height mask_width],noise_spatial_freq);
        Noise_mask=uint8(((Noise_mask-(min(min(Noise_mask))))./max(max(Noise_mask))).*noise_intensity);
        
        % show the mask
        imshow(Noise_mask)
        
        % collate the mean intensities so we can normalise them
        mean_intensity =  mean(Noise_mask(:));
        if ~exist('intensities','var'); intensities = mean_intensity; else intensities = [intensities, mean_intensity]; end
        
        % write the mask
        imwrite(Noise_mask,[allsubdirs{dirNum} filesep imgName outputExt]);
    end
end

% get an overall mean intensity for all the images
mean_intensity = mean(intensities);

% then loop through and normalise them relative to the mean
for imgNum = 1:size(allImgFiles,2)
    fprintf('normalising img %.0f of %.0f\n',imgNum,size(allImgFiles,2));

    
    thisImgName = replace(allImgFiles{imgNum},inputExt,outputExt);
    
    thisImg = imread(thisImgName);
    
    intensity = intensities(imgNum);
    
    diff = mean_intensity - intensity;
    
    adjusted=uint8(thisImg+diff);
    
    imshow(adjusted);
    
    imwrite(adjusted, thisImgName);
    
end

% return
% end


function x = spatialPattern(DIM,BETA)
% function x = spatialPattern(DIM, BETA)
%
% This function generates 1/f spatial noise, with a normal error
% distribution (the grid must be at least 10x10 for the errors to be normal).
% 1/f noise is scale invariant, there is no spatial scale for which the
% variance plateaus out, so the process is non-stationary.
%
%     DIM is a two component vector that sets the size of the spatial pattern
%           (DIM=[10,5] is a 10x5 spatial grid)
%     BETA defines the spectral distribution.
%          Spectral density S(f) = N f^BETA
%          (f is the frequency, N is normalisation coeff).
%               BETA = 0 is random white noise.
%               BETA  -1 is pink noise
%               BETA = -2 is Brownian noise
%          The fractal dimension is related to BETA by, D = (6+BETA)/2
%
% Note that the spatial pattern is periodic.  If this is not wanted the
% grid size should be doubled and only the first quadrant used.
%
% Time series can be generated by setting one component of DIM to 1

% The method is briefly descirbed in Lennon, J.L. "Red-shifts and red
% herrings in geographical ecology", Ecography, Vol. 23, p101-113 (2000)
%
% Many natural systems look very similar to 1/f processes, so generating
% 1/f noise is a useful null model for natural systems.
%
% The errors are normally distributed because of the central
% limit theorem.  The phases of each frequency component are randomly
% assigned with a uniform distribution from 0 to 2*pi. By summing up the
% frequency components the error distribution approaches a normal
% distribution.

% Written by Jon Yearsley  1 May 2004
%     j.yearsley@macaulay.ac.uk
%
% S_f corrected to be S_f = (u.^2 + v.^2).^(BETA/2);  2/10/05


% Generate the grid of frequencies. u is the set of frequencies along the
% first dimension
% First quadrant are positive frequencies.  Zero frequency is at u(1,1).
u = [(0:floor(DIM(1)/2)) -(ceil(DIM(1)/2)-1:-1:1)]'/DIM(1);
% Reproduce these frequencies along ever row
u = repmat(u,1,DIM(2));
% v is the set of frequencies along the second dimension.  For a square
% region it will be the transpose of u
v = [(0:floor(DIM(2)/2)) -(ceil(DIM(2)/2)-1:-1:1)]/DIM(2);
% Reproduce these frequencies along ever column
v = repmat(v,DIM(1),1);

% Generate the power spectrum
S_f = (u.^2 + v.^2).^(BETA/2);

% Set any infinities to zero
S_f(S_f==inf) = 0;

% Generate a grid of random phase shifts
phi = rand(DIM);

% Inverse Fourier transform to obtain the the spatial pattern
x = ifft2(S_f.^0.5 .* (cos(2*pi*phi)+i*sin(2*pi*phi)));

% Pick just the real component
x = real(x);

return
end

