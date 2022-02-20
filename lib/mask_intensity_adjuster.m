%% to be run after generating masks

inPATH = 'masks/';

outPATH = 'masks_adjusted/';

​

Q = dir(inPATH);

s = size(Q);

intensities = [];

​

for c = 3:s(1)

    the_name = Q(c).name;

    grayImage = imread(strcat(inPATH, the_name));

    mean_intensity = mean(grayImage(:));

    intensities = [intensities, mean_intensity];

end

mean_intensity = mean(intensities);

​

for c = 3:s(1)

    the_name = Q(c).name;

    grayImage = imread(strcat(inPATH, the_name));

    intensity = intensities(c - 2);

    diff = mean_intensity - intensity;

    adjusted=uint8(grayImage+diff);

    imwrite(adjusted, strcat(outPATH, the_name));

end
